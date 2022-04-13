import {Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import Colors from "../constants/Colors";


export default function MyCoursesScreen({ navigation }) {
    const onPress = () => {
        //console.log(courses);
        //TODO tuto idem dorobit CourseDetail screen
        navigation.navigate('CourseDetailScreen', { course })
    }

    return (
        <View style={{flex: 1}}>
            <ScrollView contentContainerStyle={{backgroundColor: Colors.background, margin: 5}}>
                    <Text style={styles.titleStyle}>My Courses</Text>
                    <Pressable style={({ pressed }) => [
                        {
                            backgroundColor: pressed ? Colors.tabIconSelected : Colors.primary,
                        },
                        styles.button,
                    ]}
                               onPress={onPress}>
                        <Text style={styles.titleStyle}>Dajaky kurz</Text>
                        <Text style={styles.subtitleStyle}>Dajaky autor</Text>

                    </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    titleStyle: {
        fontSize: 20,
        color: Colors.text,
        fontWeight: 'bold',
        margin: 5,
    },
    subtitleStyle: {
        fontSize: 12,
        color: Colors.text,
        fontWeight: 'bold',
        margin: 5,
    },
    container: {
        // flex: 1,
        margin: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        flexDirection: 'column',
    },
    descriptionStyle: {
        fontSize: 22,
        color: Colors.text,
        fontWeight: 'bold',
        margin: 5,
    },
    viewStyle: {
        marginBottom: 5,
        marginTop: 5,
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    contentStyle: {
        justifyContent: "center",
        margin: 5,
    },
    button: {
        margin: 5,
        //alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        elevation: 3,
        minWidth: 400,
        minHeight: 50,
    }
})